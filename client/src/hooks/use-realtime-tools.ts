import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
// import { supabase } from '@/lib/supabase'

export function useRealtimeTools() {
    const queryClient = useQueryClient()

    useEffect(() => {
        console.log('Real-time tools hook initialized (temporarily disabled)')

        // Temporarily disable real-time subscriptions to avoid runtime errors
        // TODO: Re-enable once Supabase connection is properly configured

        /*
        const channel = supabase
            .channel('tools-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tools'
                },
                (payload) => {
                    console.log('Tools table change detected:', payload)

                    // Invalidate all tools-related queries
                    queryClient.invalidateQueries({ queryKey: ['/api/tools'] })
                    queryClient.invalidateQueries({ queryKey: ['/api/stats'] })
                    queryClient.invalidateQueries({ queryKey: ['/api/activities'] })

                    // Invalidate queries with parameters that include tools endpoint
                    queryClient.invalidateQueries({
                        predicate: (query) => {
                            const queryKey = query.queryKey
                            if (!Array.isArray(queryKey) || queryKey.length === 0) return false

                            const firstKey = queryKey[0]
                            return typeof firstKey === 'string' && firstKey.includes('/api/tools')
                        }
                    })

                    // Force refetch of all queries that might be affected
                    queryClient.refetchQueries({
                        predicate: (query) => {
                            const queryKey = query.queryKey
                            if (!Array.isArray(queryKey) || queryKey.length === 0) return false

                            const firstKey = queryKey[0]
                            return typeof firstKey === 'string' &&
                                (firstKey.includes('/api/tools') ||
                                    firstKey.includes('/api/stats') ||
                                    firstKey.includes('/api/activities'))
                        }
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
        */
    }, [queryClient])
}
