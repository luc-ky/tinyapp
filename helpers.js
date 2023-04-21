// email lookup helper function
const getUserByEmail = (email, users) => {
  for (const user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail };