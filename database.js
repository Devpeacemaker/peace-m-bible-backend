
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
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function addUser(user) {
  const db = load();

  const exists = db.users.find(
    u => u.phone == user.phone
  );

  if (!exists) {
    db.users.push(user);
    save(db);
  }

  return true;
}

function getUser(phone) {
  const db = load();
  return db.users.find(u => u.phone == phone);
}

function activatePremium(phone, months) {
  const db = load();

  const user = db.users.find(
    u => u.phone == phone
  );

  if (!user) return false;

  const expiry = new Date();

  expiry.setMonth(expiry.getMonth() + months);

  user.premium = true;
  user.expiry = expiry.toISOString();

  save(db);

  return user;
}

function premiumValid(phone) {
  const user = getUser(phone);

  if (!user) return false;

  if (!user.premium) return false;

  return new Date(user.expiry) > new Date();
}

module.exports = {
  addUser,
  getUser,
  activatePremium,
  premiumValid
};
