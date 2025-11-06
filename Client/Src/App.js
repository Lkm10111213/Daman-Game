import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

function App() {
  const [colors, setColors] = useState([]);
  const [newColor, setNewColor] = useState("");
  const [user, setUser] = useState("Guest");

  useEffect(() => {
    axios.get("http://localhost:4000/api/colors").then(res => {
      setColors(res.data);
    });

    socket.on("color:posted", (data) => {
      setColors(prev => [data, ...prev]);
    });

    return () => socket.off("color:posted");
  }, []);

  const handleAdd = async () => {
    if (!newColor) return alert("Please enter a color!");
    await axios.post("http://localhost:4000/api/colors", {
      color: newColor,
      user,
    });
    setNewColor("");
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>🎨 Daman Color Trading Game</h2>

      <input
        type="text"
        placeholder="Enter your name"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      />
      <br /><br />

      <input
        type="text"
        placeholder="Enter color (e.g., red, green)"
        value={newColor}
        onChange={(e) => setNewColor(e.target.value)}
      />
      <button onClick={handleAdd}>Add Color</button>

      <h3>Live Color List 🟢</h3>
      <ul>
        {colors.map((c) => (
          <li key={c.id}>
            <b>{c.user}</b> chose <span style={{ color: c.color }}>{c.color}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
