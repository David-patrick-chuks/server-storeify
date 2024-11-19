import { Schema, model } from 'mongoose';

// Define the project schema
const projectSchema = new Schema({
  action: {
    type: String,
    enum: ['pending', 'canceled', 'completed'],
    default: 'pending',
  },
  niche: {
    type: String,
    enum: ['logo', 'branding', 'website', 'web design'],
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ['fully paid', 'partly paid', 'payment returned'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  due: {
    type: Date,
    required: true,
  },
  clientEmail: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  creatorId: {
    type: String, // You can use ObjectId if linking to the 'users' collection
    required: true,
  },
});

// Create the Project model
const Project = model('Project', projectSchema);

export default Project;
