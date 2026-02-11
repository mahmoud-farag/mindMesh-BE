import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const UserSchema = new mongoose.Schema({

  username: {
    type: String,
    required: [true, 'User Name is must'],
    unique: true,
    trim: true,
    minlength: [3, 'User Name must be at least 3 characters'],
  },

  email: {
    type: String,
    required: [true, 'Email is must'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },

  profileImage: {
    type: String,
    default: null
  },


}, { timestamps: true });

UserSchema.pre('save', async function (next) {

  if (!this.isModified('password'))
    next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

// UserSchema.methods.matchPassword = async function (enteredpassword) {

//   return await bcrypt.compare(enteredpassword, this.password);
// }



const User = mongoose.model('User', UserSchema);

export default User;
