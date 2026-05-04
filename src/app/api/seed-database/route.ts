import { NextResponse } from 'next/server'

// This endpoint provides instructions for the batch seeding process
// The actual seeding happens via /api/seed-batch

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Use the batch seeding API for large datasets',
    instructions: {
      step1: { 
        action: 'GET /api/seed-batch?action=status', 
        description: 'Check current database state' 
      },
      step2: { 
        action: 'GET /api/seed-batch?action=init', 
        description: 'Clear database and prepare for seeding' 
      },
      step3: { 
        action: 'GET /api/seed-batch?action=seed-schools', 
        description: 'Create all 39 schools' 
      },
      step4: { 
        action: 'GET /api/seed-batch?action=seed-users&schoolIndex=0&userOffset=0&userBatch=200',
        description: 'Start seeding users (repeat until complete)'
      },
      note: 'The seed-users endpoint returns nextStep with the next URL to call. Keep calling until complete=true.',
      totalUsers: '~34,640 users across 39 schools',
      defaultPassword: 'password123'
    },
    clientSidePage: 'Visit /seed.html for an interactive seeding interface'
  })
}
