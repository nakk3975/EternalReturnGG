function getAjax(url, data, successCallback) {
		        $.ajax({
		            type: "get",
		            url: url,
		            data: data,
		            dataType: "json",
		            success: successCallback,
		        });
		    }