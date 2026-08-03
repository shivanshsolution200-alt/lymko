class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();

      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');

      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);


class CartItems extends HTMLElement {

  constructor() {

    super();


    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') ||
      document.getElementById('CartDrawer-LineItemStatus');


    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]')
    )
    .reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0
    );


    this.debouncedOnChange = debounce((event) => {

      this.onChange(event);

    },300);



    // Manual quantity change
    this.addEventListener(
      'change',
      this.debouncedOnChange.bind(this)
    );



    // ===============================
    // PLUS MINUS BUTTON FIX
    // ===============================

    this.addEventListener('click',(event)=>{


      const button = event.target.closest('.quantity__button');


      if(!button) return;


      event.preventDefault();



      const input = button
      .closest('.quantity')
      .querySelector('.quantity__input');



      if(!input) return;



      let quantity = parseInt(input.value);



      if(button.name === "plus"){

        quantity++;

      }



      if(button.name === "minus"){


        if(quantity <= 1){

          return;

        }


        quantity--;

      }



      input.value = quantity;



      this.updateQuantity(
        input.dataset.index,
        quantity,
        button.name
      );



    });


  }





  onChange(event){


    this.updateQuantity(

      event.target.dataset.index,

      event.target.value,

      document.activeElement.getAttribute('name')

    );


  }





  getSectionsToRender(){


    let sections = [

      {
        id:'main-cart-items',
        section:document.getElementById('main-cart-items').dataset.id,
        selector:'.js-contents'
      },


      {
        id:'cart-icon-bubble',
        section:'cart-icon-bubble',
        selector:'.shopify-section'
      },


      {
        id:'cart-live-region-text',
        section:'cart-live-region-text',
        selector:'.shopify-section'
      },


      {
        id:'main-cart-footer',
        section:document.getElementById('main-cart-footer').dataset.id,
        selector:'.js-contents'
      }


    ];



    if(document.querySelector('#main-cart-footer .free-shipping')){


      sections.push({

        id:'main-cart-progress',

        section:
        document.getElementById('main-cart-progress').dataset.id,

        selector:'.js-contents'

      });


    }



    return sections;


  }






  updateQuantity(line,quantity,name){


    this.enableLoading(line);



    const body = JSON.stringify({


      line,

      quantity,


      sections:
      this.getSectionsToRender()
      .map((section)=>section.section),



      sections_url:window.location.pathname


    });




    fetch(`${routes.cart_change_url}`,{

      ...fetchConfig(),

      ...{

        body

      }


    })
.then((response)=>{

  return response.text();

})

.then((state)=>{


  const parsedState = JSON.parse(state);



  this.classList.toggle(
    'is-empty',
    parsedState.item_count === 0
  );



  const cartDrawerWrapper =
  document.querySelector('cart-drawer');



  const cartFooter =
  document.getElementById('main-cart-footer');



  if(cartFooter){

    cartFooter.classList.toggle(
      'is-empty',
      parsedState.item_count === 0
    );

  }



  if(cartDrawerWrapper){

    cartDrawerWrapper.classList.toggle(
      'is-empty',
      parsedState.item_count === 0
    );

  }




  this.getSectionsToRender().forEach((section)=>{


    const elementToReplace =
    document
    .getElementById(section.id)
    .querySelector(section.selector)
    ||
    document.getElementById(section.id);



    elementToReplace.innerHTML =
    this.getSectionInnerHTML(
      parsedState.sections[section.section],
      section.selector
    );


  });




  this.updateLiveRegions(
    line,
    parsedState.item_count
  );



  this.disableLoading();



})



.catch(()=>{


  this.querySelectorAll('.loading-overlay')
  .forEach((overlay)=>{

    overlay.classList.add('hidden');

  });



  const errors =
  document.getElementById('cart-errors')
  ||
  document.getElementById('CartDrawer-CartErrors');



  if(errors){

    errors.textContent =
    window.cartStrings.error;

  }



  this.disableLoading();


});



}





updateLiveRegions(line,itemCount){


  if(this.currentItemCount === itemCount){


    const lineItemError =
    document.getElementById(`Line-item-error-${line}`)
    ||
    document.getElementById(`CartDrawer-LineItemError-${line}`);



    const quantityElement =
    document.getElementById(`Quantity-${line}`)
    ||
    document.getElementById(`Drawer-quantity-${line}`);



    if(lineItemError && quantityElement){

      lineItemError
      .querySelector('.cart-item__error-text')
      .innerHTML =
      window.cartStrings.quantityError.replace(
        '[quantity]',
        quantityElement.value
      );

    }


  }



  this.currentItemCount = itemCount;



  const cartStatus =
  document.getElementById('cart-live-region-text')
  ||
  document.getElementById('CartDrawer-LiveRegionText');



  if(cartStatus){

    cartStatus.setAttribute(
      'aria-hidden',
      false
    );



    setTimeout(()=>{

      cartStatus.setAttribute(
        'aria-hidden',
        true
      );

    },1000);

  }


}





getSectionInnerHTML(html,selector){


  return new DOMParser()

  .parseFromString(
    html,
    'text/html'
  )

  .querySelector(selector)

  .innerHTML;


}





enableLoading(line){


  const mainCartItems =
  document.getElementById('main-cart-items')
  ||
  document.getElementById('CartDrawer-CartItems');



  if(mainCartItems){

    mainCartItems.classList.add(
      'cart__items--disabled'
    );

  }



  const cartItemElements =
  this.querySelectorAll(
    `#CartItem-${line} .loading-overlay`
  );



  const cartDrawerElements =
  this.querySelectorAll(
    `#CartDrawer-Item-${line} .loading-overlay`
  );



  [
    ...cartItemElements,
    ...cartDrawerElements
  ]
  .forEach((overlay)=>{

    overlay.classList.remove('hidden');

  });



  document.activeElement.blur();



}





disableLoading(){


  const mainCartItems =
  document.getElementById('main-cart-items')
  ||
  document.getElementById('CartDrawer-CartItems');



  if(mainCartItems){

    mainCartItems.classList.remove(
      'cart__items--disabled'
    );

  }


}



}



customElements.define(
  'cart-items',
  CartItems
);





// CART NOTE

if(!customElements.get('cart-note')){


customElements.define(

'cart-note',

class CartNote extends HTMLElement{


constructor(){

super();



this.addEventListener(

'change',

debounce((event)=>{


const body = JSON.stringify({

note:event.target.value

});



fetch(

`${routes.cart_update_url}`,

{

...fetchConfig(),

...{

body

}

}

);



},300)

);


}



}

);



}





// DETAILS ACCORDION

document.addEventListener(
"DOMContentLoaded",

()=>{


const detailsElement =
document.querySelector(".cart-group");



if(!detailsElement) return;



const details =
detailsElement.querySelectorAll("details");



details.forEach((targetDetail)=>{


targetDetail.addEventListener(
"click",

()=>{


details.forEach((detail)=>{


if(detail !== targetDetail){

detail.removeAttribute("open");

}


});


}

);


});


});