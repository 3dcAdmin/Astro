import type { FunctionalComponent } from 'preact';
import { h, Fragment } from 'preact';
import EditOnGithub from './EditOnGithub';
import ThemeToggle from '../ThemeToggle';

const More: FunctionalComponent<{ editHref: string }> = ({ editHref }) => {
  return (
    <>
      <h2 class="heading">More</h2>
      <ul>
        <li class={`header-link depth-2`}>
          <EditOnGithub href={editHref} />
        </li>
        <li class={`header-link depth-2`}>
          <a href={editHref} target="_blank">
            <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88.6 77.3" height="1.24em" width="1.24em" style="margin: -2px;"> <path fill="currentColor" d="M61,24.6h7.9l18.7,51.6h-7.7l-5.4-15.5H54.3l-5.6,15.5h-7.2L61,24.6z M72.6,55l-8-22.8L56.3,55H72.6z" /> <path fill="currentColor" d="M53.6,60.6c-10-4-16-9-22-14c0,0,1.3,1.3,0,0c-6,5-20,13-20,13l-4-6c8-5,10-6,19-13c-2.1-1.9-12-13-13-19h8          c4,9,10,14,10,14c10-8,10-19,10-19h8c0,0-1,13-12,24l0,0c5,5,10,9,19,13L53.6,60.6z M1.6,16.6h56v-8h-23v-7h-9v7h-24V16.6z" /> </svg>
            <span>Translate this page</span>
          </a>
        </li>
        <li class={`header-link depth-2`}>
          <a href="https://astro.build/chat" target="_blank">
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="comment-alt"
              class="svg-inline--fa fa-comment-alt fa-w-16"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              height="1em"
              width="1em"
            >
              <path
                fill="currentColor"
                d="M448 0H64C28.7 0 0 28.7 0 64v288c0 35.3 28.7 64 64 64h96v84c0 9.8 11.2 15.5 19.1 9.7L304 416h144c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64z"
              ></path>
            </svg>
            <span>Join the community</span>
          </a>
        </li>
      </ul>
      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <ThemeToggle />
      </div>
    </>
  );
};

export default More;
