export function prepareImage( blob: Blob ): Promise<Blob> {
    return new Promise( resolve => {
        const image = new Image();
        image.src = URL.createObjectURL( blob );
        image.onload = () => {
            const canvas = document.createElement( "canvas" );
            const context = canvas.getContext( "2d" )!;
            const padding = 75;

            // enforce an image with of 500;
            const scale =  300 / image.width;

            const imageWidth = image.width * scale;
            const imageHeight = image.height * scale;

            canvas.width = imageWidth + padding * 2;
            canvas.height = imageHeight + padding * 2;


            context.fillStyle = "white";
            context.fillRect( 0, 0, canvas.width, canvas.height );
            context.drawImage( image, padding, padding,  imageWidth, imageHeight );

            context.beginPath();
            context.moveTo( padding, padding );
            context.lineTo( padding + 30, padding );
            context.lineTo( padding, padding + 30 );
            context.closePath();
            context.fill();

            context.beginPath();
            context.moveTo( canvas.width - padding, canvas.height - padding );
            context.lineTo( canvas.width - padding - 30, canvas.height - padding );
            context.lineTo( canvas.width - padding, canvas.height - padding - 30 );
            context.closePath();
            context.fill();

            canvas.toBlob( ( b: Blob | null ) => {
                resolve( b! );
            }, "image/png" );
        };
    } );
}
