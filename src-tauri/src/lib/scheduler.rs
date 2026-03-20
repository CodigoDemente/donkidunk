use std::{collections::HashMap, time::Duration};

use log::debug;
use tokio::{task::JoinHandle, time::sleep};

pub struct Scheduler {
    handlers: HashMap<String, JoinHandle<()>>,
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            handlers: HashMap::new(),
        }
    }

    pub fn schedule_task<F, Fut>(&mut self, task_name: String, function: F, periodicity: Duration)
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = ()> + Send + Sync,
    {
        debug!("Scheduling task: {task_name}");

        if let Some(handle) = self.handlers.remove(&task_name) {
            handle.abort();
        }

        self.handlers.insert(
            task_name.clone(),
            tokio::spawn(async move {
                loop {
                    debug!("Running task: {task_name}");
                    function().await;

                    sleep(periodicity).await;
                }
            }),
        );
    }

    pub fn stop_scheduler(&mut self) {
        for (task_name, handler) in self.handlers.drain() {
            debug!("Stopping task: {task_name}");
            handler.abort();
        }
    }

    pub fn stop_task(&mut self, task_name: String) {
        debug!("Stopping task: {task_name}");

        if let Some(handler) = self.handlers.remove(&task_name) {
            handler.abort();
        }
    }
}
