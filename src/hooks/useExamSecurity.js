import { useEffect, useState, useCallback } from 'react'

/**
 * Custom hook for exam security features
 * Prevents cheating during exams by:
 * - Disabling copy/paste/right-click
 * - Tracking tab switching
 * - Tracking time spent
 * - Optional fullscreen mode
 */
export function useExamSecurity(options = {}) {
    const {
        enableCopyPasteBlock = true,
        enableTabSwitchTracking = true,
        enableTimeTracking = true,
        enableFullscreen = false,
        onTabSwitch = null,
        onCopyAttempt = null,
        onPasteAttempt = null
    } = options

    const [securityEvents, setSecurityEvents] = useState([])
    const [tabSwitchCount, setTabSwitchCount] = useState(0)
    const [timeSpent, setTimeSpent] = useState(0)
    const [isVisible, setIsVisible] = useState(true)

    // Log security event
    const logSecurityEvent = useCallback((type, metadata = {}) => {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            metadata
        }
        setSecurityEvents(prev => [...prev, event])
        console.warn('Security Event:', event)
        return event
    }, [])

    // Disable copy/paste/cut/right-click
    useEffect(() => {
        if (!enableCopyPasteBlock) return

        const handleCopy = (e) => {
            e.preventDefault()
            logSecurityEvent('copy_attempt')
            if (onCopyAttempt) onCopyAttempt(e)
        }

        const handleCut = (e) => {
            e.preventDefault()
            logSecurityEvent('cut_attempt')
        }

        const handlePaste = (e) => {
            e.preventDefault()
            logSecurityEvent('paste_attempt')
            if (onPasteAttempt) onPasteAttempt(e)
        }

        const handleContextMenu = (e) => {
            e.preventDefault()
            logSecurityEvent('context_menu_attempt')
        }

        const handleKeyDown = (e) => {
            // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+P, F12
            if (
                (e.ctrlKey && ['c', 'v', 'x', 'a', 'p'].includes(e.key.toLowerCase())) ||
                (e.metaKey && ['c', 'v', 'x', 'a', 'p'].includes(e.key.toLowerCase())) ||
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault()
                logSecurityEvent('keyboard_shortcut_attempt', { key: e.key })
            }
        }

        document.addEventListener('copy', handleCopy)
        document.addEventListener('cut', handleCut)
        document.addEventListener('paste', handlePaste)
        document.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('cut', handleCut)
            document.removeEventListener('paste', handlePaste)
            document.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [enableCopyPasteBlock, logSecurityEvent, onCopyAttempt, onPasteAttempt])

    // Track tab switching
    useEffect(() => {
        if (!enableTabSwitchTracking) return

        const handleVisibilityChange = () => {
            const visible = !document.hidden
            setIsVisible(visible)

            if (!visible) {
                // Tab switched away
                setTabSwitchCount(prev => prev + 1)
                const event = logSecurityEvent('tab_switch', { visible: false })
                if (onTabSwitch) onTabSwitch(event)
            } else {
                // Tab switched back
                logSecurityEvent('tab_return', { visible: true })
            }
        }

        const handleBlur = () => {
            logSecurityEvent('window_blur')
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleBlur)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleBlur)
        }
    }, [enableTabSwitchTracking, logSecurityEvent, onTabSwitch])

    // Track time spent
    useEffect(() => {
        if (!enableTimeTracking) return

        const startTime = Date.now()
        const interval = setInterval(() => {
            if (isVisible) {
                setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [enableTimeTracking, isVisible])

    // Fullscreen mode
    useEffect(() => {
        if (!enableFullscreen) return

        const requestFullscreen = () => {
            const elem = document.documentElement
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.warn('Failed to enter fullscreen:', err)
                })
            }
        }

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                logSecurityEvent('fullscreen_exit')
            }
        }

        // Request fullscreen on mount
        requestFullscreen()

        document.addEventListener('fullscreenchange', handleFullscreenChange)

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { })
            }
        }
    }, [enableFullscreen, logSecurityEvent])

    // Prevent browser back button
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = 'Yakin ingin meninggalkan ujian? Progress Anda akan disimpan.'
            return e.returnValue
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        // Prevent back button
        window.history.pushState(null, '', window.location.href)
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href)
            logSecurityEvent('back_button_attempt')
        }
        window.addEventListener('popstate', handlePopState)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            window.removeEventListener('popstate', handlePopState)
        }
    }, [logSecurityEvent])

    return {
        securityEvents,
        tabSwitchCount,
        timeSpent,
        isVisible,
        logSecurityEvent
    }
}
