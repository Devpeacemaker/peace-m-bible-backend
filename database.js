const fs = require("fs");

const FILE = "./database.json";

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(
    FILE,
    JSON.stringify(
      {
        users: []
      },
      null,
      2
    )
  );
}

function load() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function addUser(user) {
  const db = load();

  const exists = db.users.find(u => u.phone === user.phone);

  if (!exists) {
    db.users.push(user);
    save(db);
    return user;
  }

  return exists;
}

function getUser(phone) {
  const db = load();
  return db.users.find(u => u.phone === phone);
}

function activatePremium(phone, months) {
  const db = load();

  const user = db.users.find(u => u.phone === phone);

  if (!user) return null;

  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);

  user.premium = true;
  user.expiry = expiry.toISOString();

  save(db);

  return user;
}

function premiumValid(phone) {
  const db = load();

  const user = db.users.find(u => u.phone === phone);

  if (!user) return false;

  if (!user.premium) return false;

  if (!user.expiry) return false;

  const valid = new Date(user.expiry) > new Date();

  if (!valid) {
    user.premium = false;
    user.expiry = null;
    save(db);
  }

  return valid;
}

module.exports = {
  addUser,
  getUser,
  activatePremium,
  premiumValid
};
