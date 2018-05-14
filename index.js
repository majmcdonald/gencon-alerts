//configuration
const config = require('./config');

const moment = require('moment');
const axios = require('axios');
const nodemailer = require('nodemailer');
const striptags = require('striptags');

//simple database to avoid duplicates
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json')
const db = low(adapter)

//search time
const timeString = moment().subtract(config.searchHours, 'hours').format('YYYY-MM-DD HH:mm:ss');

//this should probably go into the configuration
const searchString = encodeURI("http://gencon.highprogrammer.com/gencon-2018.cgi/search/?action=s&avail=0&start=0&end=0&game=&title=&gm=&group=&minage=&maxage=&minexp=&maxexp=&added="+timeString+"&t=ANI&t=KID&t=SPA&t=BGM&t=LRP&t=TCG&t=EGM&t=MHE&t=TRD&t=ENT&t=CGM&t=TDA&t=FLM&t=NMN&t=WKS&t=HMN&t=RPG&t=ZED&t=SEM&.submit=Search+for+events&.cgifields=t");


// Set some defaults (required if your JSON file is empty)
db.defaults({ events: [] })
    .write();

console.log('searching '+searchString)

axios.get(searchString)

    .then(function (response) {
        let newEvents = [];
        //grep the response for all Events
        let matches = response.data.match(/([A-Z]{3}\d+)/g);
        if(matches) {
            let unique = matches.filter((v, i, a) => a.indexOf(v) === i);
            unique.forEach(function (item) {
                 if(!db.get('events').find({ id: item }).value()) {
                     //save
                     db.get('events')
                         .push({ id: item})
                         .write()
                     newEvents.push(item) ;
                 }
            });
        }

        //send email, if needed
        let transport = nodemailer.createTransport(config.nodemailer.transport);

        if(!response.data.match(/No events were found matching your requirements/) && newEvents.length) {
            console.log('new events found, sending');
            //add domain name to urls
            let htmlText = response.data.replace(/\/gencon\-2018\.cgi\//g, "http://gencon.highprogrammer.com/gencon-2018.cgi/")
            htmlText += '<br /><br />New: '+newEvents.join(','); 
            return transport.sendMail({
                from: config.from_email,
                to: config.to_email,
                subject: 'New Gencon Events Found!',
                html: htmlText,
                text: striptags(htmlText)
            });
        } else {
            console.log('No new events found');
            return true;
        }
    })
    .then(function(info) {
        console.log('send complete:'+info.messageId);
    })
    .catch(function (error) {
        console.log('error!'+error);
    });


