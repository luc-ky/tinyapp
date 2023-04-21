// generate random 6 length string from all alphanumberic characters
const generateRandomString = () => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
};

// email lookup helper function
const getUserByEmail = (email, users) => {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return undefined;
};

// return urls that belong to user
const urlsForUser = (id, urlDatabase) => Object.fromEntries(
  Object.entries(urlDatabase).filter((entry) => entry[1].userID === id)
);

module.exports = { generateRandomString, getUserByEmail, urlsForUser };