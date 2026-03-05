import EmojiPickerReact, { EmojiStyle, type Props, Theme } from 'emoji-picker-react';
import { Popover } from 'radix-ui';
import { useState } from 'react';

export function EmojiPicker({ onEmojiClick }: Props) {
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

	return (
		<Popover.Root open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
			<Popover.Trigger className="cursor-pointer text-3xl aspect-square">
				{isEmojiPickerOpen ? '😀' : '🙂'}
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content>
					<EmojiPickerReact
						theme={Theme.DARK}
						lazyLoadEmojis
						emojiStyle={EmojiStyle.NATIVE}
						skinTonesDisabled
						previewConfig={{ showPreview: false }}
						onEmojiClick={onEmojiClick}
					/>
					<Popover.Arrow />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
