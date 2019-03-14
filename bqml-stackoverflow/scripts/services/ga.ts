export function gaEvent( event: { [ key: string ]: string } ) {
    ( ( <any> window ).dataLayer || [] ).push( event );
}
