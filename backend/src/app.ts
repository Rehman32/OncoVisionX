import express, { Application,Request,Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

//import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';


//import middlewares
import { errorHandler, notFound } from './middleware/errorHandler';


//express app
const app: Application = express();

//security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

//rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: "Too many requests from this IP , please try again later .",
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
});

app.use("/api", limiter);

//body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//logging

if(process.env.NODE_ENV=== 'development'){
    app.use(morgan('dev'));
}
else{
    app.use(morgan('combined'));
}

//routes

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'OncoVisionX API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to CancerVision360 API',
    version: '1.0.0',
    documentation: '/api/docs' 
  });
});

// API ROUTES 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


//error handliing

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;