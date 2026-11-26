export function profileRooms(profile = {}) {
  const rooms = Array.isArray(profile.codigoSalas) ? profile.codigoSalas : [];
  return [...new Set([...rooms, profile.codigoSala].filter((room) => typeof room === "string" && room))];
}

export function chooseProfileRoom(profile = {}) {
  const rooms = profileRooms(profile);
  if (rooms.length <= 1) return rooms[0] || "";
  const answer = prompt(`Escolha a turma (${rooms.map((room, index) => `${index + 1}: ${room}`).join(" · ")})`, "1")?.trim();
  if (!answer) return "";
  const index = Number(answer) - 1;
  if (Number.isInteger(index) && rooms[index]) return rooms[index];
  return rooms.includes(answer.toUpperCase()) ? answer.toUpperCase() : "";
}
