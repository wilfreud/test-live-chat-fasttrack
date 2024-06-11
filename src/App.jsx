import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000"); // Adjust the URL to your NestJS server

const App = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [fromId, setFromId] = useState("6666d942ed847ad7ec1714a9");
  const [toId, setToId] = useState("6666d785e4950594c54439da");
  console.log(messages);
  useEffect(() => {
    // Load existing messages on page load
    if (fromId && toId) {
      axios
        .get(`http://localhost:5000/messages/${fromId}/${toId}`)
        .then((response) => {
          console.warn(response);
          setMessages(response.data || []);
        });
    }

    // Listen for new messages
    socket.on("message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Listen for message deletion
    socket.on("messageDeleted", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((m) => m._id !== messageId)
      );
    });

    return () => {
      socket.off("message");
      socket.off("messageDeleted");
    };
  }, [fromId, toId]);

  const joinRoom = () => {
    const room = `${fromId}_${toId}`;
    setRoomId(room);
    socket.emit("joinRoom", { fromId, toId });
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", { fromId, toId });
    setRoomId("");
  };

  const sendMessage = () => {
    const payload = { fromId, toId, content: message };
    socket.emit("message", payload);
    setMessage("");
    axios
      .get(`http://localhost:5000/messages/${fromId}/${toId}`)
      .then((response) => {
        setMessages(response.data || []);
      });
  };

  const deleteMessage = (messageId) => {
    socket.emit("deleteMessage", { id: messageId });
  };

  return (
    <div>
      <h1>Live Chat</h1>
      <div style={{ display: "none" }}>
        <input
          type="text"
          placeholder="From ID"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
        />
        <input
          type="text"
          placeholder="To ID"
          value={toId}
          onChange={(e) => setToId(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send Message</button>
      </div>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg) => (
            <li key={msg._id} className="flex">
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {msg.content}{" "}
                <p style={{ fontSize: 12 }}>({msg.from.firstName})</p>
                <button
                  className="text-xs"
                  style={{ fontSize: 12 }}
                  onClick={() => deleteMessage(msg._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
