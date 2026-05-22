import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import errorHandler from './_middleware/error-handler';
import accountsController from './accounts/accounts.controller';
const swaggerDocs = require('./_helpers/swagger.js');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS — in production use the exact frontend origin set via CORS_ORIGIN env var
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:4000';
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (curl, Postman, Swagger UI same-origin)
        if (!origin || origin === allowedOrigin) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

// api routes
app.use('/accounts', accountsController);

// swagger docs route
app.use('/api-docs', swaggerDocs);

// global error handler
app.use(errorHandler);

// start server — dev uses port 3000 to avoid conflict with Angular (port 4000)
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
