import { exec, ChildProcess } from 'child_process';

let anvilProcess: ChildProcess;

export const startAnvil = (): Promise<void> => {
  stopAnvil();
  return new Promise((resolve, reject) => {
    anvilProcess = exec('./scripts/start-anvil.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`Anvil error: ${stderr}`);
        return reject(error);
      } else {
        console.log(`Anvil started with PID ${anvilProcess.pid}`);
      }
    });
    // Wait a few seconds to ensure anvil is up
    setTimeout(() => resolve(), 3000);
  });
};

export const stopAnvil = (): void => {
  exec('kill $(lsof -t -i:8545)');
};
