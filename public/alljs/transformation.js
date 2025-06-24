const htransform=document.getElementById('web-name');
// Apply transformation automatically on page load
window.onload = () => {
    htransform.style.transition = "transform 0.3s ease"; // Smooth transition
    htransform.style.transform = "scale(1.1)"; // Slightly scale up
};
// Reset to original state after a delay (optional)
setTimeout(() => {
    htransform.style.transform = 'scale(1)'; // Return to original state after 1 second
}, 1200); // 4 second delay before resetting


const h2transformation=document.getElementsByTagName('h2');
 Array.from(h2transformation).forEach(h2transform =>{
    h2transform.addEventListener("mouseenter",() =>{
        h2transform.style.transition="transform 0.3s ease";
        // Ensure a smooth transition
        h2transform.style.transform="scale(1)";
        //ptransform.style.transform = "scale(1) 
    });

    h2transform.addEventListener('mouseleave', () => {
        // When the mouse leaves the card, scale it back to its original size (1)
        h2transform.style.transform = 'scale(0.9)';
    });
 });


 const h3transformation=document.getElementsByTagName('h3');
 Array.from(h3transformation).forEach(h3transform =>{
    h3transform.addEventListener("mouseenter",() =>{
        h3transform.style.transition="transform 0.3s ease";
        // Ensure a smooth transition
        h3transform.style.transform="scale(1)";
        //ptransform.style.transform = "scale(1) 
    });

    h3transform.addEventListener('mouseleave', () => {
        // When the mouse leaves the card, scale it back to its original size (1)
        h3transform.style.transform = 'scale(0.9)';
    });
 });







