import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
        this.cartId = null;
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();

        // event listener for the "Add All To Cart" button
        const addButton = document.getElementById('addAllToCart');
        if (addButton) {
          addButton.addEventListener('click', this.addAllToCart.bind(this));
        }
        // event listener and rendering for "Remove All Items" button
        this.checkCartItems();
        const removeButton = document.getElementById('removeAllItems')
        if (removeButton) {
          // check if cart has items, set removeButton display to block
          removeButton.addEventListener('click', this.removeAllItems.bind(this));
        }
    }

    addAllToCart() {
      const productElements = document.querySelectorAll('[data-product-id]');
      const lineItems = [];
      // create list of lineItems to be added to cart
      productElements.forEach(element => {
          const productId = parseInt(element.getAttribute('data-product-id'), 10);
          if (productId) {
              lineItems.push({
                  productId: productId,
                  quantity: 1
              });
          }
      });
      // Check if cartId exists
      if (this.cartId) {
          // Use the endpoint to add items to the existing cart
          this.addItemsToExistingCart(lineItems);
      } else {
          // Create a new cart and store the cartId
          this.createNewCart(lineItems);
      }
    }

    removeAllItems() {
      // fetch the current cart to get the cart ID
      fetch('/api/storefront/carts/')
        .then(response => response.json())
        .then(data => {
            const cart = data[0]; // assuming the first cart is the current user's cart

            if (!cart) {
                throw new Error('No cart found.');
            }

            // use the API to delete the entire cart
            const options = {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            return fetch(`/api/storefront/carts/${cart.id}`, options);
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete the cart.');
            }
            alert('All items have been removed from the cart!');
            this.hideRemoveAllButton()
            this.updateCartCount('delete'); // update the cart count to 0
            this.cartId = null
        })
        .catch(error => {
            console.error(error);
            alert('There was an error removing items from the cart.');
        });
    }

    addItemsToExistingCart(lineItems) {
      const options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lineItems: lineItems })
      };
  
      fetch(`/api/storefront/carts/${this.cartId}/items`, options)
          .then(response => {
              if (response.ok) {
                  return response.json();
              } else {
                  return response.json().then(data => {
                      throw new Error(data.detail || 'Failed to add products to the cart');
                  });
              }
          })
          .then(data => {
              // update cart number
              const combinedItems = [
                  ...data.lineItems.physicalItems,
                  ...data.lineItems.digitalItems,
                  ...data.lineItems.giftCertificates,
                  ...data.lineItems.customItems
              ];
              this.updateCartCount(combinedItems.length);
              alert('All products have been added to the cart!');
          })
          .catch(error => {
              alert('There was an error adding products to the cart.');
              console.log(error);
          });
    }

    createNewCart(lineItems) {
      const options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lineItems: lineItems })
      };

      fetch('/api/storefront/carts', options)
      .then(response => {
        if (response.status >= 200 && response.status < 300) {
            return response.json();
        } else {
          response.json().then(data => {
            console.log(data);
          })
          throw new Error('Failed to add products to the cart');
        }
      })
      .then(data => {
          // update cart number
          const combinedItems = [
            ...data.lineItems.physicalItems,
            ...data.lineItems.digitalItems,
            ...data.lineItems.giftCertificates,
            ...data.lineItems.customItems
          ]
          this.updateCartCount(combinedItems.length)
          this.showRemoveAllButton()
          this.cartId = data.id
          alert('All products have been added to the cart!');
      })
      .catch(error => {
          alert('There was an error adding products to the cart.');
      });
    }

    updateCartCount(itemsAdded) {
      const cartCountElement = document.querySelector('.cart-quantity');
      const newCount = parseInt(cartCountElement.textContent) + itemsAdded
      if (cartCountElement) {
          if (itemsAdded == 'delete') {
              cartCountElement.classList.remove('countPill--positive') // hide cart count
          } else {
              cartCountElement.textContent = newCount;
              cartCountElement.classList.add('countPill--positive') // show cart count
          }
      }
    }

    showRemoveAllButton() {
      const removeButton = document.getElementById('removeAllItems');
      if (!removeButton) return; // Exit if the button doesn't exist
      removeButton.style.display = 'block'
    }

    hideRemoveAllButton() {
      const removeButton = document.getElementById('removeAllItems');
      if (!removeButton) return; // Exit if the button doesn't exist
      removeButton.style.display = 'none'
    }

    checkCartItems() {
      const removeButton = document.getElementById('removeAllItems');
      if (!removeButton) return; // Exit if the button doesn't exist
  
      fetch('/api/storefront/carts/')
          .then(response => response.json())
          .then(data => {
              const cart = data[0]; // Assuming the first cart is the current user's cart
  
              if (!cart) {
                  removeButton.style.display = 'none'; // Hide button if no cart found
                  return;
              }

              this.cartId = cart.id
  
              const totalItems = [
                  ...cart.lineItems.physicalItems,
                  ...cart.lineItems.digitalItems,
                  ...cart.lineItems.giftCertificates,
                  ...cart.lineItems.customItems
              ].length;
  
              if (totalItems > 0) {
                  removeButton.style.display = 'block'; // Show button if there are items in the cart
              } else {
                  removeButton.style.display = 'none'; // Hide button if cart is empty
              }
          })
          .catch(error => {
              console.error(error);
              removeButton.style.display = 'none'; // Hide button in case of an error
          });
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
