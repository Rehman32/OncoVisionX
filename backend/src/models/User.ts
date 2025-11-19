import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "doctor" | "researcher";
  phoneNumber?: string;
  licenseNumber?: string;
  institution?: string;
  department?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  //methods : like find_by_email etc
}

const UserSchema = new Schema<IUser, IUserModel>({
  email: {
    type: String,
    required: [true, "Email is Required "],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: [true, "Password is Required "],
    minlength: [8, "Password must be atleast 8 characters "],
    select: false,
  },

  firstName: {
    type: String,
    required: [true, "First name is Required"],
    trim: true,
    maxlength: [20, "First name can not be exceed 50 characters"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is Required "],
    trim: true,
    maxlength: [20, "Last Name can not exceed 20 characters"],
  },
  role: {
    type: String,
    enum: {
      values: ["admin", "doctor", "researcher"],
      messages: "{VALUE} is not a valid role",
    },
    default: "doctor",
    required: true,
    index: true,
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[\d\s\-()]+$/, "Please provide a valid phone number"],
  },
  licenseNumber: {
    type: String,
    trim: true,
  },
  institution: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
  },
},
{
    timestamps: true ,
    toJSON: {
        transform:function(_doc,ret:any) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    }
}
);

//composit index for role based queries
UserSchema.index({
    role:1,
    isActive:1
})

//middleware

UserSchema.pre('save',async function(next)  {
    if(!this.isModified('password')){
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error :any) {
        next(error);
    }
});

UserSchema.methods.comparePassword = async function(
    candidatePassword : string
) : Promise<boolean>{
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

//export model

export default mongoose.model<IUser,IUserModel>('User',UserSchema);