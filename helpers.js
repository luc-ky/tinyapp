// generate random 6 length string from all possible alphanumberic characters
const generateRandomString = () => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // generate an array of length 6 and fill it with possible characters, then concatenate into a string and return value
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
};

// checks if a user is registered in the database using their email
const getUserByEmail = (email, users) => {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return undefined;
};

// return urls that belong to user
const urlsForUser = (userID, urlDatabase) => {
  let userUrls = {};
  // loop through each URL in the database
  for (let url in urlDatabase) {
    // if the URL belongs to the given user, add it to the userUrls object
    if (urlDatabase[url].userID=== userID) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };