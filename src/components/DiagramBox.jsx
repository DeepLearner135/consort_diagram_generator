import React, { useRef, useEffect, useState } from 'react';

// Debounce helper to prevent excessive rendering
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearInterval(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const DiagramBox = ({
    id,
    title,
    content,
    className = "",
    style = {},
    isHtml = false,
    onTextChange
}) => {
    const handleInput = (key, text) => {
        if (onTextChange) {
            onTextChange(id, key, text);
        }
    };

    return (
        <div id={id} className={`dia-box ${className}`} style={style}>
            {title !== undefined && title !== null && (
                <div
                    className="dia-label"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleInput('title', e.currentTarget.innerText)}
                >
                    {title}
                </div>
            )}
            {isHtml ? (
                <div
                    className="dia-count"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleInput('content', e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            ) : (
                <div
                    className="dia-count"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleInput('content', e.currentTarget.innerText)}
                >
                    {content}
                </div>
            )}
        </div>
    );
};
