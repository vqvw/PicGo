package main

type Message struct {
	Type         string            `json:"type,omitempty"`
	Client       *Client           `json:"client,omitempty"`
	Nickname     string            `json:"nickname,omitempty"`
	Costume      string            `json:"costume,omitempty"`
	X            int               `json:"x,omitempty"`
	Y            int               `json:"y,omitempty"`
	CanvasWidth  int               `json:"canvas_width,omitempty"`
	CanvasHeight int               `json:"canvas_height,omitempty"`
	Clients      map[string]string `json:"clients,omitempty"`
	NumClients   int               `json:"num_clients,omitempty"`
	Token        string            `json:"token,omitempty"`
	Chat         string            `json:"chat,omitempty"`
	Error        string            `json:"error,omitempty"`
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) sendToAll(m Message) {
	for client := range h.clients {
		select {
		case client.send <- m:
		default:
			close(client.send)
			delete(h.clients, client)
		}
	}
}

func (h *Hub) sendToAllBarSender(m Message) {
	for client := range h.clients {
		if client != m.Client {
			select {
			case client.send <- m:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}

func (h *Hub) sendToSender(m Message) {
	select {
	case m.Client.send <- m:
	default:
		close(m.Client.send)
		delete(h.clients, m.Client)
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				if _, ok := clientData[client]; ok {
					h.sendToAllBarSender(Message{Type: "disconnected", Nickname: clientData[client]["nickname"], NumClients: len(h.clients) - 1})
				}
				delete(clientData, client)
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			switch message.Type {
			case "point":
				h.sendToAllBarSender(message)
			case "getToken":
				var token string
				clients := make(map[string]string)
				nickname := message.Nickname
				costume := message.Costume
				if len(nickname) < 1 || len(nickname) > 15 {
					message.Error = "Nickname must be between 1 and 15 characters"
					h.sendToSender(message)
					goto invalid
				}
				if _, ok := clientData[message.Client]; ok {
					message.Error = "Client already registered"
					h.sendToSender(message)
					goto invalid
				}
				for _, client := range clientData {
					if client["nickname"] == nickname {
						message.Error = "Nickname is in use"
						h.sendToSender(message)
						goto invalid
					}
					clients[client["nickname"]] = client["costume"]
				}
				token = genToken()
				clientData[message.Client] = map[string]string{
					"nickname": nickname,
					"token":    token,
					"costume":  costume,
				}
				message.Nickname = nickname
				message.Token = token
				message.Costume = costume
				message.Clients = clients
				h.sendToSender(message)
				h.sendToAll(Message{Type: "connected", Nickname: nickname, Costume: costume, NumClients: len(h.clients)})
			invalid:
				continue
			case "erase":
				h.sendToAll(message)
			case "chat":
				if len(message.Chat) > 0 && len(message.Chat) < 40 {
					message.Nickname = clientData[message.Client]["nickname"]
					h.sendToAll(message)
				} else {
					message.Error = "Chat message must be less than 40 characters long"
					h.sendToSender(message)
				}
			}
		}
	}
}
