# Noah Connolly oBundle Test

After setting up my store and Stencil CLI, I created the Special Item product on the admin dashboard.

## Secondary Image on Hover:

I inspected the HTML of the local stencil environment and found the figure element that contains the product image. I used class information to search through my project directory to find card.html, which includes all of the relevant html elements. After familiarizing myself with handlebar.js and the template structure, I added a second image element and some additional classes to both images for styling. Then I added css to the theme.scss to render the primary or secondary image based on the hover state.

## Add All Button:

I found the category.html and category.js. I added a button to the html file and event listeners to the js file that fires off a addAllToCart function to gather all lineItems in the current category, add them to the cart utilizing the storefront API, then alert the user of a success or failure. I noticed the cart quantity wasn’t being updated so I added a function to update that element to show the updated quantity when items are successfully added. I ran into bugs when I tried to add all items a second time. I ended up adding a cartID variable and to track if the user has an active cart or not. If the cartID exists, we update the existing cart instead of creating a new one. 

## Remove All Button:

In the same catergory files, I added a function to remove all items from the cart by deleting the cart. Additionally, I added some rendering logic to display the remove all button based on the state of the cart. 

## Customer Banner:

For the bonus section, I added a template with an if block in category.html to render customer information if the user is logged in. 
