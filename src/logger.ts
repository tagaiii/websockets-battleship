import { colors } from './utils';

export const logger = (
  source: 'SERVER' | 'CLIENT',
  type: string,
  message: string
) => {
  console.log(colors.green(`[${source}] type: "${type}"`));
  console.log(message);
  console.log(colors.yellow('--------------------------------'));
};
