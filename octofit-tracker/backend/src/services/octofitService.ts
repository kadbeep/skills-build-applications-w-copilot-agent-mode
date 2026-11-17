import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function createValidationError(message: string) {
  const error = Object.assign(new Error(message), { status: 400 });
  return error;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  // Step 1: Structural validation
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createValidationError('Input must be an object');
  }

  const body = input as Record<string, unknown>;

  // Step 2: Required field presence
  if (!body.userId || !body.teamId || !body.type || typeof body.minutes === 'undefined') {
    throw createValidationError('Missing required fields: userId, teamId, type, minutes');
  }

  // Step 3: ID format validation
  if (!mongoose.Types.ObjectId.isValid(String(body.userId)) || !mongoose.Types.ObjectId.isValid(String(body.teamId))) {
    throw createValidationError('userId and teamId must be valid MongoDB ObjectIds');
  }

  // Step 4: Type field validation
  if (typeof body.type !== 'string' || body.type.trim() === '') {
    throw createValidationError('type must be a non-empty string');
  }

  // Step 5: Minutes field validation
  const minutes = Number(body.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw createValidationError('minutes must be a positive number');
  }

  // Step 6: Fetch User document
  const userDoc = await User.findById(body.userId);
  if (!userDoc) {
    throw createValidationError(`User not found with ID: ${body.userId}`);
  }

  // Step 7: Fetch Team document
  const teamDoc = await Team.findById(body.teamId);
  if (!teamDoc) {
    throw createValidationError(`Team not found with ID: ${body.teamId}`);
  }

  // Step 8: Compute points from minutes and type
  const pointsMultiplier: Record<string, number> = {
    run: 1.0,
    walk: 1.0,
    swim: 2.0,
    bike: 1.0,
    cycle: 1.0,
    strength: 1.0,
  };
  const multiplier = pointsMultiplier[body.type.toLowerCase()] ?? 1.0;
  const computedPoints = minutes * multiplier;

  // Step 9: Create and save Activity document
  const newActivity = new Activity({
    user: body.userId,
    team: body.teamId,
    type: body.type,
    minutes,
    points: computedPoints,
    occurredAt: new Date(),
  });
  const savedActivity = await newActivity.save();

  // Step 10: Return saved document
  return savedActivity;
}

export async function listTeams() {
  const teams = await Team.find().populate('members').lean();
  
  // Convert member ObjectIds to string representations
  return teams.map((team) => ({
    ...team,
    members: (team.members as any[]).map((member) => member._id?.toString() ?? member),
  }));
}

export async function createTeam(input: unknown) {
  // Structural validation
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw createValidationError('Input must be an object');
  }

  const body = input as Record<string, unknown>;

  // Required field presence: name and mascot must be present
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    throw createValidationError('name is required and must be a non-empty string');
  }

  if (!body.mascot || typeof body.mascot !== 'string' || body.mascot.trim() === '') {
    throw createValidationError('mascot is required and must be a non-empty string');
  }

  // Members array is optional; default to empty array
  let members: string[] = [];
  if (body.members) {
    if (!Array.isArray(body.members)) {
      throw createValidationError('members must be an array');
    }
    members = body.members.map(String);
    // Validate that all member IDs are valid ObjectIds
    for (const memberId of members) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw createValidationError(`Invalid member ID: ${memberId}`);
      }
    }
  }

  // Create and save Team document
  const newTeam = new Team({
    name: body.name,
    mascot: body.mascot,
    members,
  });
  const savedTeam = await newTeam.save();

  // Populate members before returning
  await savedTeam.populate('members');

  return savedTeam;
}

export async function getLeaderboard() {
  // Fetch all teams and their activities
  const teams = await Team.find().lean();
  
  // For each team, calculate total points
  const leaderboardEntries = await Promise.all(
    teams.map(async (team) => {
      const totalPoints = await Activity.aggregate([
        { $match: { team: team._id } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ]);
      
      return {
        teamId: team._id,
        teamName: team.name,
        totalPoints: totalPoints[0]?.total ?? 0,
      };
    })
  );

  // Sort by total points descending
  leaderboardEntries.sort((a, b) => b.totalPoints - a.totalPoints);

  // Add 1-based rank
  return leaderboardEntries.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Find user by email
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw createValidationError(`User not found with email: ${userEmail}`);
  }

  // Get user's recent activities to analyze patterns
  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();

  // Determine focus area: prefer user's fitnessGoal, fall back to recent activity type
  let focusArea = user.fitnessGoal;
  if (!focusArea && recentActivities.length > 0) {
    // Map activity type to fitness focus
    const activityTypeToFocus: Record<string, string> = {
      run: 'endurance',
      walk: 'endurance',
      swim: 'endurance',
      bike: 'endurance',
      cycle: 'endurance',
      strength: 'strength',
    };
    focusArea = activityTypeToFocus[recentActivities[0].type] ?? 'endurance';
  }

  // Find workouts matching the user's focus
  const workouts = await Workout.find({ focus: focusArea }).lean();

  if (workouts.length === 0) {
    // Fall back to any workouts if none match focus
    return Workout.find().limit(3).lean();
  }

  // Return workouts with reasons
  return workouts.map((workout) => ({
    ...workout,
    reason: `Matches your ${focusArea} goal based on your ${recentActivities.length > 0 ? recentActivities[0].type : 'fitness'} activity`,
  }));
}

export { User };
