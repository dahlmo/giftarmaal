import type { SvelteComponent } from 'svelte';
import Home from './views/Home.svelte';
import Message from './views/Message.svelte';

const Router = (props: { path: string; message: string }) => {
  const { path, message } = props;
  let Component: typeof SvelteComponent = Home as any;
  if (path === '/message') Component = Message as any;
  return new Component({ target: document.createElement('div'), props: { message } }) as any;
};

export default Router;
