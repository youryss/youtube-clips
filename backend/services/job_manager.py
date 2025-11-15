#!/usr/bin/env python3
"""
Job Manager Service
Handles background job processing with queue management
"""

import threading
import queue
from .processor import VideoProcessor


class JobManager:
    """Manages video processing jobs"""
    
    def __init__(self, max_workers=1):
        self.max_workers = max_workers
        self.job_queue = queue.Queue()
        self.active_jobs = {}
        self.lock = threading.Lock()
        self.workers = []
        self.running = False
    
    def start(self):
        """Start the job manager"""
        if self.running:
            return
        
        self.running = True
        
        # Start worker threads
        for i in range(self.max_workers):
            worker = threading.Thread(target=self._worker, daemon=True)
            worker.start()
            self.workers.append(worker)
        
        print(f"Job manager started with {self.max_workers} workers")
    
    def stop(self):
        """Stop the job manager"""
        self.running = False
        
        # Wait for workers to finish
        for worker in self.workers:
            worker.join(timeout=5)
        
        print("Job manager stopped")
    
    def add_job(self, job_id, user_id):
        """Add a job to the queue"""
        with self.lock:
            self.job_queue.put((job_id, user_id))
        
        print(f"Job {job_id} added to queue")
    
    def cancel_job(self, job_id):
        """Cancel a job"""
        with self.lock:
            if job_id in self.active_jobs:
                processor = self.active_jobs[job_id]
                processor.cancel()
                print(f"Job {job_id} cancelled")
    
    def _worker(self):
        """Worker thread that processes jobs"""
        while self.running:
            try:
                # Get job from queue (timeout to allow checking self.running)
                job_id, user_id = self.job_queue.get(timeout=1)
                
                # Process job
                processor = VideoProcessor(job_id, user_id)
                
                with self.lock:
                    self.active_jobs[job_id] = processor
                
                try:
                    processor.process()
                finally:
                    with self.lock:
                        if job_id in self.active_jobs:
                            del self.active_jobs[job_id]
                
                self.job_queue.task_done()
            
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Worker error: {e}")
                import traceback
                traceback.print_exc()


# Global job manager instance
_job_manager = None


def get_job_manager():
    """Get the global job manager instance"""
    global _job_manager
    if _job_manager is None:
        _job_manager = JobManager()
        _job_manager.start()
    return _job_manager

