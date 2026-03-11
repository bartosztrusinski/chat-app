import EmojiPickerReact, {
	type Props as EmojiPickerProps,
	EmojiStyle,
	Theme,
} from 'emoji-picker-react';
import { Popover } from 'radix-ui';
import { type CSSProperties, useState } from 'react';

type Props = EmojiPickerProps & {
	onCloseAutoFocus?: () => void;
};

export function EmojiPicker({ onEmojiClick, onCloseAutoFocus }: Props) {
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

	return (
		<Popover.Root open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
			<Popover.Trigger
				title={isEmojiPickerOpen ? 'Close emoji picker' : 'Open emoji picker'}
				className="cursor-pointer text-2xl size-10 rounded-xl aria-expanded:bg-neutral-700 shrink-0"
			>
				<span aria-hidden="true">{isEmojiPickerOpen ? '😀' : '🙂'}</span>
				<span className="sr-only">
					{isEmojiPickerOpen ? 'Close emoji picker' : 'Open emoji picker'}
				</span>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					align="start"
					className="origin-(--radix-popover-content-transform-origin)
            transform-gpu 
            data-[state=open]:animate-[scaleIn_190ms_cubic-bezier(0.22,1,0.36,1)]
            data-[state=closed]:animate-[scaleOut_120ms_cubic-bezier(0.4,0,1,1)]"
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						onCloseAutoFocus?.();
					}}
				>
					<EmojiPickerReact
						theme={Theme.DARK}
						emojiStyle={EmojiStyle.NATIVE}
						width={330}
						height={450}
						lazyLoadEmojis
						skinTonesDisabled
						previewConfig={{ showPreview: false }}
						onEmojiClick={onEmojiClick}
						style={
							{
								'--epr-bg-color': 'var(--color-neutral-800)',
								'--epr-category-label-bg-color':
									'color-mix(in oklab, var(--color-neutral-800) 90%, transparent)',
								'--epr-category-label-text-color': 'var(--color-neutral-200)',
								'--epr-search-input-bg-color': 'var(--color-neutral-700)',
								'--epr-search-input-bg-color-active': 'var(--color-neutral-700)',
								'--epr-search-input-text-color': 'inherit',
								'--epr-emoji-size': '1.75em',
							} as CSSProperties
						}
					/>
					<Popover.Arrow />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
