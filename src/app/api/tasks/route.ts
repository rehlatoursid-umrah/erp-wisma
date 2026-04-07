import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const month = searchParams.get('month')   // 0-11
    const year = searchParams.get('year')

    try {
        const andQuery: any[] = []

        if (category) {
            andQuery.push({ category: { equals: category } })
        }

        // Filter by month/year using dueDate field
        if (month !== null && year !== null) {
            const startOfMonth = new Date(Number(year), Number(month), 1).toISOString()
            const endOfMonth = new Date(Number(year), Number(month) + 1, 0, 23, 59, 59).toISOString()
            andQuery.push({ dueDate: { greater_than_equal: startOfMonth } })
            andQuery.push({ dueDate: { less_than_equal: endOfMonth } })
        }

        const tasks = await payload.find({
            collection: 'tasks',
            where: andQuery.length > 0 ? { and: andQuery } : {},
            sort: '-createdAt',
            limit: 200,
            pagination: false,
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
        const { title, category, priority, description, assigneeName, dueDate } = body

        const newTask = await payload.create({
            collection: 'tasks',
            data: {
                title,
                category: category || 'bpupd',
                priority: priority || 'normal',
                description: description || '',
                status: 'pending',
                relatedRoom: assigneeName || '', // reuse relatedRoom field to store assignee name
                dueDate: dueDate || new Date().toISOString(),
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
        const { id, status, title, priority, assigneeName, description } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        const updateData: any = {}
        if (status !== undefined) {
            updateData.status = status
            if (status === 'done') updateData.completedAt = new Date().toISOString()
        }
        if (title !== undefined) updateData.title = title
        if (priority !== undefined) updateData.priority = priority
        if (assigneeName !== undefined) updateData.relatedRoom = assigneeName
        if (description !== undefined) updateData.description = description

        const updatedTask = await payload.update({
            collection: 'tasks',
            id,
            data: updateData,
        })

        return NextResponse.json(updatedTask)
    } catch (error) {
        console.error('Error updating task:', error)
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const payload = await getPayload({ config })

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        await payload.delete({ collection: 'tasks', id })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting task:', error)
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }
}
