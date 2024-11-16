import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  action: 'pending' | 'canceled' | 'completed';  // Add any other action states if needed
  niche: 'logo' | 'branding' | 'website' | "web design";
  amount: number;
  paymentMode: "fully paid" | "partly paid" | "payment returned";
  date: Date;
  due: Date;
  description: string,
  clientEmail: string;
  creatorId: string;  // This would likely reference a user (you can use ObjectId here if needed)
}

// Define your project schema and model here
const projectSchema = new Schema<IProject>({
  action: {
    type: String,
    enum: ['pending', 'canceled', 'completed'],
    default: 'pending',
  },
  niche: {
    type: String,
    enum: ['logo' , 'branding' , 'website' , "web design"],
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ["fully paid" , "partly paid", "payment returned"],
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
    type: String,  // You can use ObjectId if linking to the 'users' collection
    required: true,
  },
});

const Project = model<IProject>('Project', projectSchema);

export default Project;
