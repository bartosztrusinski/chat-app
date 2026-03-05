import EmojiPickerReact, {
	type Props as EmojiPickerProps,
	EmojiStyle,
	Theme,
} from 'emoji-picker-react';
import { Popover } from 'radix-ui';
import { useState } from 'react';

type Props = EmojiPickerProps & {
	onCloseAutoFocus?: () => void;
};

export function EmojiPicker({ onEmojiClick, onCloseAutoFocus }: Props) {
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

	return (
		<Popover.Root open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
			<Popover.Trigger className="cursor-pointer text-3xl aspect-square">
				{isEmojiPickerOpen ? '😀' : '🙂'}
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					align="start"
					onCloseAutoFocus={(event) => {
						event.preventDefault();
						onCloseAutoFocus?.();
					}}
				>
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
