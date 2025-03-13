import { spawn, ChildProcess } from 'child_process';

let anvilProcess: ChildProcess | null = null;

export const startAnvil = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Kill any existing process first
    if (anvilProcess) {
      if (anvilProcess.pid) {
        process.kill(-anvilProcess.pid);
      }
      anvilProcess = null;
    }

    anvilProcess = spawn('../../scripts/start-anvil.sh', {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });

    anvilProcess.unref();

    anvilProcess.on('error', err => {
      console.error('Failed to start anvil:', err);
      reject(err);
    });

    // Wait a bit to ensure anvil has started
    setTimeout(() => resolve(), 3000);
  });
};

export const stopAnvil = (): Promise<void> => {
  return new Promise(resolve => {
    if (anvilProcess) {
      // Kill the entire process group
      try {
        if (anvilProcess.pid) {
          process.kill(-anvilProcess.pid, 'SIGTERM');
        }
      } catch (error) {
        console.error('Error killing anvil process:', error);
      }

      // Listen for the process to exit
      anvilProcess.on('close', () => {
        anvilProcess = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
};
