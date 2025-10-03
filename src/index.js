
import {app} from './app.js'
import mongoConnect from './db/index.js';
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT;

mongoConnect()
    .then(() => {
        app.listen(port, () => {
            console.log(`App listening on the port http://localhost:${port}`);
        });
    }).catch((err) => {
        console.log("Error is connecting the mongodb to url")
    })

