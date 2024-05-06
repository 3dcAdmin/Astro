import { getActionProps, actions, isInputError } from 'astro:actions';
import { useState } from 'react';

export function PostComment({
	postId,
	serverBodyError,
}: {
	postId: string;
	serverBodyError?: string;
}) {
	const [comments, setComments] = useState<{ author: string; body: string }[]>([]);
	const [bodyError, setBodyError] = useState<string | undefined>(serverBodyError);

	return (
		<>
			<form
				method="POST"
				onSubmit={async (e) => {
					e.preventDefault();
					const form = e.target as HTMLFormElement;
					const formData = new FormData(form);
					const { data, error } = await actions.blog.comment.safe(formData);
					if (isInputError(error)) {
						return setBodyError(error.fields.body?.join(' '));
					}
					if (data) {
						setBodyError(undefined);
						setComments((c) => [data.comment, ...c]);
					}
					form.reset();
				}}
			>
				<input {...getActionProps(actions.blog.comment)} />
				<input type="hidden" name="postId" value={postId} />
				<label className="sr-only" htmlFor="author">
					Author
				</label>
				<input id="author" type="text" name="author" placeholder="Your name" />
				<textarea rows={10} name="body"></textarea>
				{bodyError && <p style={{ color: 'red' }}>{bodyError}</p>}
				<button type="submit">Post</button>
			</form>
			{comments.map((c) => (
				<article
					style={{
						border: '2px solid color-mix(in srgb, var(--accent), transparent 80%)',
						padding: '0.3rem 1rem',
						borderRadius: '0.3rem',
						marginBlock: '0.3rem',
					}}
				>
					<p>{c.body}</p>
					<p>{c.author}</p>
				</article>
			))}
		</>
	);
}
