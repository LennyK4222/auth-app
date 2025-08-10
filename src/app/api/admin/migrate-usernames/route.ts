import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function POST() {
  try {
    await connectToDatabase();

    // Find users without username and update them
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    const updatePromises = usersWithoutUsername.map(async (user) => {
      let username = user.name;
      
      // If no name, use email prefix
      if (!username && user.email) {
        username = user.email.split('@')[0];
      }
      
      // If still no username, use "User" + user ID
      if (!username) {
        username = `User${(user._id as any).toString().slice(-6)}`;
      }

      // Ensure username is unique by adding numbers if needed
      let finalUsername = username;
      let counter = 1;
      
      while (await User.findOne({ 
        username: finalUsername, 
        _id: { $ne: user._id } 
      })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      return User.updateOne(
        { _id: user._id },
        { $set: { username: finalUsername } }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Updated ${usersWithoutUsername.length} users with usernames`
    });

  } catch (error) {
    console.error('Error updating usernames:', error);
    return NextResponse.json(
      { error: 'Failed to update usernames' },
      { status: 500 }
    );
  }
}
