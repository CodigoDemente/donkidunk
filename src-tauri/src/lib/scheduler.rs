use std::{collections::HashMap, sync::Arc, time::Duration};

use log::debug;
use tokio::{sync::Mutex, task::JoinHandle, time::sleep};

pub enum TaskNextAction {
    Keep,
    Stop,
}

pub struct Scheduler {
    handlers: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn has_task(&self, task_name: &str) -> bool {
        self.handlers.lock().await.contains_key(task_name)
    }

    pub async fn schedule_task<F, Fut>(
        &mut self,
        task_name: String,
        function: F,
        periodicity: Duration,
    ) where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = TaskNextAction> + Send + Sync,
    {
        debug!("Scheduling task: {task_name}");

        let mut handlers_guard = self.handlers.lock().await;

        if let Some(handle) = handlers_guard.remove(&task_name) {
            handle.abort();
        }

        let owned_handlers = self.handlers.clone();

        handlers_guard.insert(
            task_name.clone(),
            tokio::spawn(async move {
                loop {
                    debug!("Running task: {task_name}");
                    match function().await {
                        TaskNextAction::Keep => sleep(periodicity).await,
                        TaskNextAction::Stop => break,
                    }
                }

                let mut guard = owned_handlers.lock().await;

                guard.remove(&task_name);
            }),
        );
    }

    pub async fn stop_scheduler(&mut self) {
        let mut handlers_guard = self.handlers.lock().await;

        for (task_name, handler) in handlers_guard.drain() {
            debug!("Stopping task: {task_name}");
            handler.abort();
        }
    }

    pub async fn stop_task(&mut self, task_name: String) {
        debug!("Stopping task: {task_name}");

        let mut handlers_guard = self.handlers.lock().await;

        if let Some(handler) = handlers_guard.remove(&task_name) {
            handler.abort();
        }
    }
}
