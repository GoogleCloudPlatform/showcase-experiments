export function formatNumber( value: string | number ): string {
    value = value.toString();

    const end = value.length;
    let sponge = value.substring( Math.max( end - 3, 0 ), end );

    for ( let i = end - 3; i > 0; i -= 3 ) {
        sponge = `${ value.substring( Math.max( i - 3, 0 ), i ) },${ sponge }`;
    }

    return sponge;
}
