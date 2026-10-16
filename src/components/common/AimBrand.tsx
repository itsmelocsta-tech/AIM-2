import React from 'react';

/** Original selected purple-and-silver orbital-arrow asset, without recoloring. */
export function AimBrand({ large = false }: { large?: boolean }) {
  return <img src="/brand/aim-orbital-arrow.png" alt="AIM orbital arrow logo" width="1254" height="1254"
    className={large ? 'h-28 w-28 sm:h-36 sm:w-36 object-contain shrink-0' : 'h-12 w-12 object-contain shrink-0'} />;
}
