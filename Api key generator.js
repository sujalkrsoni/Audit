const bcrypt = await import("bcrypt");
const hash = await bcrypt.default.hash("secret123", 10);
console.log(hash);
