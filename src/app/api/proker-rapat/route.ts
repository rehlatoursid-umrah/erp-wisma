import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const monthParam = searchParams.get('month') // Format: YYYY-MM
        
        let startDate: Date
        let endDate: Date

        if (monthParam) {
            const [year, month] = monthParam.split('-')
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
            endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
        } else {
            // Default to current month
            const now = new Date()
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        }

        const payload = await getPayload({ config: configPromise })

        // Fetch tasks by dueDate matching the selected month
        const tasks = await payload.find({
            collection: 'tasks',
            where: {
                and: [
                    { dueDate: { greater_than_equal: startDate.toISOString() } },
                    { dueDate: { less_than_equal: endDate.toISOString() } }
                ]
            },
            limit: 500,
            sort: '-dueDate',
        })

        // Fetch all users to map assignee names
        const users = await payload.find({
            collection: 'users',
            limit: 100,
            pagination: false,
        })
        const userMap = new Map(users.docs.map(u => [u.id, u]))

        // Group tasks by category (division)
        const categories = ['bpupd', 'bppg', 'bendahara', 'direktur', 'housekeeping', 'maintenance', 'inventory', 'admin', 'general']
        
        const groupedData = categories.reduce((acc, cat) => {
            acc[cat] = {
                title: getCategoryTitle(cat),
                tasks: [],
                stats: { total: 0, completed: 0, pending: 0, in_progress: 0 }
            }
            return acc
        }, {} as Record<string, any>)

        tasks.docs.forEach((task: any) => {
            const cat = task.category || 'general'
            if (!groupedData[cat]) {
                groupedData[cat] = { title: getCategoryTitle(cat), tasks: [], stats: { total: 0, completed: 0, pending: 0, in_progress: 0 } }
            }
            
            // Map assignee data
            const assigneeDoc = typeof task.assignee === 'string' ? userMap.get(task.assignee) : task.assignee
            const enhancedTask = { ...task, assigneeData: assigneeDoc }

            groupedData[cat].tasks.push(enhancedTask)
            groupedData[cat].stats.total += 1
            
            if (task.status === 'done') groupedData[cat].stats.completed += 1
            else if (task.status === 'in_progress') groupedData[cat].stats.in_progress += 1
            else groupedData[cat].stats.pending += 1
        })

        // Sort tasks within each group (High priority first, then status)
        Object.keys(groupedData).forEach(key => {
            groupedData[key].tasks.sort((a: any, b: any) => {
                const priorityWeight = { high: 3, normal: 2, low: 1 }
                const pA = priorityWeight[(a.priority as keyof typeof priorityWeight)] || 0
                const pB = priorityWeight[(b.priority as keyof typeof priorityWeight)] || 0
                if (pA !== pB) return pB - pA // High to Low
                
                // Then sort by status
                if (a.status !== b.status) {
                    if (a.status === 'pending') return -1
                    if (b.status === 'pending') return 1
                    if (a.status === 'in_progress') return -1
                    return 1
                }
                return 0
            })
        })

        return NextResponse.json({
            success: true,
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                label: startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
            },
            data: groupedData
        })

    } catch (error) {
        console.error('Proker Rapat API error:', error)
        return NextResponse.json({ error: 'Failed to fetch proker data' }, { status: 500 })
    }
}

function getCategoryTitle(cat: string): string {
    const titles: Record<string, string> = {
        'general': '📢 General (Piket)',
        'bpupd': '✈️ BPUPD',
        'bppg': '🏠 BPPG',
        'bendahara': '💰 Bendahara',
        'direktur': '👔 Direktur',
        'housekeeping': '🧹 Housekeeping',
        'maintenance': '🔧 Maintenance',
        'inventory': '📦 Inventory',
        'admin': '📝 Admin',
    }
    return titles[cat] || cat.toUpperCase()
}
