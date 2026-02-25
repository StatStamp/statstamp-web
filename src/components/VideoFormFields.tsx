interface Props {
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder?: string;
  description: string;
  onDescriptionChange: (value: string) => void;
}

const inputClass =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition';

export function VideoFormFields({
  title,
  onTitleChange,
  titlePlaceholder = 'Video title',
  description,
  onDescriptionChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          maxLength={255}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );
}
