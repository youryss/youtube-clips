#!/usr/bin/env python3
"""
WebSocket event handlers
"""

from flask_socketio import emit, join_room, leave_room


def register_socket_events(socketio):
    """Register WebSocket event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        print('Client connected')
        emit('connected', {'message': 'Connected to server'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        print('Client disconnected')
    
    @socketio.on('join')
    def handle_join(data):
        """Join a room (for job-specific updates)"""
        room = data.get('room')
        if room:
            join_room(room)
            emit('joined', {'room': room}, room=room)
    
    @socketio.on('leave')
    def handle_leave(data):
        """Leave a room"""
        room = data.get('room')
        if room:
            leave_room(room)
            emit('left', {'room': room}, room=room)


# Helper functions for emitting updates
def emit_job_update(socketio, job_id, data):
    """Emit job update to specific room"""
    room = f'job_{job_id}'
    socketio.emit('job_update', data, room=room)


def emit_progress(socketio, job_id, progress, step):
    """Emit progress update"""
    room = f'job_{job_id}'
    socketio.emit('progress', {
        'job_id': job_id,
        'progress': progress,
        'step': step
    }, room=room)


def emit_log(socketio, job_id, message, level='info'):
    """Emit log message"""
    room = f'job_{job_id}'
    socketio.emit('log', {
        'job_id': job_id,
        'message': message,
        'level': level
    }, room=room)


def emit_error(socketio, job_id, error):
    """Emit error message"""
    room = f'job_{job_id}'
    socketio.emit('error', {
        'job_id': job_id,
        'error': error
    }, room=room)


def emit_complete(socketio, job_id, clips_created):
    """Emit job completion"""
    room = f'job_{job_id}'
    socketio.emit('complete', {
        'job_id': job_id,
        'clips_created': clips_created
    }, room=room)

