const config = {};

config.to_email = 'to@example.com';
config.from_email = 'from@example.com';
config.searchHours = 48;

config.nodemailer = {};

// debug transport
// see https://nodemailer.com/transports/ for actually sending email
config.nodemailer.transport = {streamTransport: true, newline: 'unix'};

module.exports = config;
