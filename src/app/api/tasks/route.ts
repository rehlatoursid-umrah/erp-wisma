import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    try {
        const query: any = {}
        if (category) {
            query.category = { equals: category }
        }

        const tasks = await payload.find({
            collection: 'tasks',
            where: query,
            sort: '-createdAt',
            limit: 50,
        })

        return NextResponse.json(tasks.docs)
    } catch (error) {
        console.error('Error fetching tasks:', error)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { title, category, priority, description } = body

        const newTask = await payload.create({
            collection: 'tasks',
            data: {
                title,
                category: category || 'general',
                priority: priority || 'normal',
                description: description || '',
                status: 'pending',
                dueDate: new Date().toISOString(),
            },
        })

        return NextResponse.json(newTask)
    } catch (error) {
        console.error('Error creating task:', error)
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const payload = await getPayload({ config })

    try {
        const body = await req.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
        }

        const updatedTask = await payload.update({
            collection: 'tasks',
            id,
            data: {
                status,
                ...(status === 'done' ? { completedAt: new Date().toISOString() } : {}),
            },
        })

        return NextResponse.json(updatedTask)
    } catch (error) {
        console.error('Error updating task:', error)
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}
