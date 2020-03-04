function getRandom() {
    return Math.random().toString(36).substr(2);
};

module.exports.getNewToken = function () {
    return getRandom() + getRandom();
};

module.exports.getDate = function () {
    const date = new Date();
    return date.getTime();
}

module.exports.getUID = function () {
    const date = `${this.getDate()}`;
    const randomNumber = `${Math.floor(Math.random()*10)}`;
    const uid = parseInt(date + randomNumber);
    return uid;
}
